import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';

export interface ImagePickerResult {
  uri: string;
  width: number;
  height: number;
  canceled: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * 图片压缩配置
 */
const IMAGE_CONFIG = {
  maxWidth: 1080,
  maxHeight: 1080,
  quality: 0.8,
  format: ImageManipulator.SaveFormat.JPEG,
};

/**
 * 请求相册权限
 */
export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/**
 * 请求相机权限
 */
export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

/**
 * 从相册选择图片
 */
export async function pickImageFromLibrary(): Promise<ImagePickerResult | null> {
  const hasPermission = await requestMediaLibraryPermission();
  if (!hasPermission) {
    throw new Error('需要相册访问权限才能选择图片');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    canceled: false,
  };
}

/**
 * 使用相机拍照
 */
export async function takePhoto(): Promise<ImagePickerResult | null> {
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    throw new Error('需要相机权限才能拍照');
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    canceled: false,
  };
}

/**
 * 压缩图片
 */
export async function compressImage(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: IMAGE_CONFIG.maxWidth,
            height: IMAGE_CONFIG.maxHeight,
          },
        },
      ],
      {
        compress: IMAGE_CONFIG.quality,
        format: IMAGE_CONFIG.format,
      }
    );

    return result.uri;
  } catch (error) {
    console.error('Image compression failed:', error);
    // 如果压缩失败，返回原图
    return uri;
  }
}

/**
 * 上传图片到 Supabase Storage
 */
export async function uploadImage(
  bucket: string,
  path: string,
  imageUri: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 压缩图片
  const compressedUri = await compressImage(imageUri);

  // 读取图片为 blob
  const response = await fetch(compressedUri);
  const blob = await response.blob();

  // 生成文件名
  const extension = 'jpg';
  const fileName = `${path}/${Date.now()}.${extension}`;

  // 模拟上传进度（Supabase JS SDK 暂不支持真实进度）
  if (onProgress) {
    onProgress({ loaded: 0, total: blob.size, percentage: 0 });
  }

  // 上传到 Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, blob, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`上传失败: ${error.message}`);
  }

  // 完成进度
  if (onProgress) {
    onProgress({ loaded: blob.size, total: blob.size, percentage: 100 });
  }

  // 获取公开 URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * 删除图片
 */
export async function deleteImage(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`删除失败: ${error.message}`);
  }
}

/**
 * 上传打卡图片
 */
export async function uploadCheckInImage(
  predictionId: string,
  imageUri: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const path = `${user.id}/${predictionId}`;
  return uploadImage('check-ins', path, imageUri, onProgress);
}

/**
 * 获取图片尺寸信息
 */
export function getImageSizeText(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}






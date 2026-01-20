import { useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Share,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { formatDate } from '@/lib/utils';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  prediction: {
    title: string;
    description?: string | null;
    total_stake: number;
    deadline: string;
    referee_code: string;
  };
}

export function ShareModal({ visible, onClose, prediction }: ShareModalProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);

  // 生成 Deep Link URL（可以替换为实际的 URL scheme）
  const shareUrl = `aura://referee/${prediction.referee_code}`;

  const handleShare = async () => {
    if (!viewShotRef.current?.capture) return;

    setIsSharing(true);
    try {
      // 截图
      const uri = await viewShotRef.current.capture();
      
      // 检查是否支持分享
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: '分享预测',
        });
      } else {
        // 降级到文本分享
        await Share.share({
          message: `我在 Aura 上创建了一个预测：「${prediction.title}」\n\n监督码：${prediction.referee_code}\n\n下载 Aura 输入监督码来监督我完成目标！`,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>邀请监督人</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Share Card */}
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
            <View style={styles.shareCard}>
              {/* Logo */}
              <View style={styles.logoRow}>
                <View style={styles.logoIcon}>
                  <Ionicons name="sparkles" size={16} color="#a855f7" />
                </View>
                <Text style={styles.logoText}>Aura</Text>
              </View>

              {/* Content */}
              <Text style={styles.cardTitle}>{prediction.title}</Text>
              {prediction.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {prediction.description}
                </Text>
              )}

              {/* Info */}
              <View style={styles.cardInfo}>
                <View style={styles.cardInfoItem}>
                  <Ionicons name="diamond" size={14} color="#a855f7" />
                  <Text style={styles.cardInfoText}>{prediction.total_stake} 积分</Text>
                </View>
                <View style={styles.cardInfoItem}>
                  <Ionicons name="calendar" size={14} color="#64748b" />
                  <Text style={styles.cardInfoText}>{formatDate(prediction.deadline)}</Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* QR Code */}
              <View style={styles.qrSection}>
                <View style={styles.qrContainer}>
                  <QRCode
                    value={shareUrl}
                    size={100}
                    backgroundColor="#1e1e24"
                    color="#ffffff"
                  />
                </View>
                <View style={styles.qrInfo}>
                  <Text style={styles.qrLabel}>监督码</Text>
                  <Text style={styles.qrCode}>{prediction.referee_code}</Text>
                  <Text style={styles.qrHint}>扫码或输入监督码加入</Text>
                </View>
              </View>
            </View>
          </ViewShot>

          {/* Actions */}
          <TouchableOpacity
            onPress={handleShare}
            disabled={isSharing}
            style={styles.shareButton}
          >
            {isSharing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={styles.shareButtonText}>分享给朋友</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            分享后朋友可以扫码或输入监督码来监督你
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0f0f14',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  closeButton: {
    padding: 4,
  },
  shareCard: {
    backgroundColor: '#1e1e24',
    borderRadius: 16,
    padding: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
    marginBottom: 16,
  },
  cardInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  cardInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardInfoText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 20,
  },
  qrSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrContainer: {
    padding: 8,
    backgroundColor: '#1e1e24',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  qrInfo: {
    flex: 1,
    marginLeft: 16,
  },
  qrLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  qrCode: {
    fontSize: 24,
    fontWeight: '700',
    color: '#a855f7',
    letterSpacing: 2,
    marginBottom: 4,
  },
  qrHint: {
    fontSize: 12,
    color: '#52525b',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#a855f7',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  hint: {
    fontSize: 12,
    color: '#52525b',
    textAlign: 'center',
    marginTop: 12,
  },
});

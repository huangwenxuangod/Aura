import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

    // 初始化 Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { userId, credits } = paymentIntent.metadata;

        if (!userId || !credits) {
          console.error('Missing metadata in payment intent');
          break;
        }

        const creditsAmount = parseInt(credits, 10);

        // 添加 credits 到用户账户
        const { error: updateError } = await supabaseAdmin.rpc('add_credits', {
          p_user_id: userId,
          p_amount: creditsAmount,
        });

        if (updateError) {
          console.error('Failed to add credits:', updateError);
          throw updateError;
        }

        // 记录交易
        const { error: transactionError } = await supabaseAdmin
          .from('credit_transactions')
          .insert({
            user_id: userId,
            type: 'purchase',
            amount: creditsAmount,
            description: `Stripe payment: ${paymentIntent.id}`,
          });

        if (transactionError) {
          console.error('Failed to record transaction:', transactionError);
        }

        console.log(`Added ${creditsAmount} credits to user ${userId}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { userId, credits } = paymentIntent.metadata;

        if (userId) {
          // 记录失败的交易（可选）
          console.log(`Payment failed for user ${userId}, amount: ${credits}`);
        }

        console.log('Payment failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }
});


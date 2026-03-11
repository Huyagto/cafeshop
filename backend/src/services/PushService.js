import webpush from 'web-push';
import prisma from '../config/database.js';

class PushService {
  constructor() {
    webpush.setVapidDetails(
      'mailto:' + (process.env.VAPID_EMAIL || 'admin@coffee.com'),
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }

  async subscribe(userId, subscription) {
    try {
      await prisma.pushSubscription.create({
        data: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Subscribe error:', error);
      throw error;
    }
  }

  async sendToUser(userId, payload) {
    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId }
      });

      const promises = subscriptions.map(sub => 
        this.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }, payload)
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Send to user error:', error);
    }
  }

  async sendNotification(subscription, payload) {
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify(payload)
      );
    } catch (error) {
      if (error.statusCode === 410) {
        // Subscription expired, remove it
        await prisma.pushSubscription.delete({
          where: { endpoint: subscription.endpoint }
        });
      }
      console.error('Push notification error:', error);
    }
  }

  async notifyOrderStatus(orderId, status) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });

    if (!order) return;

    const messages = {
      PREPARING: 'Đơn hàng của bạn đang được chuẩn bị',
      READY: 'Đơn hàng của bạn đã sẵn sàng! Vui lòng đến quầy lấy',
      COMPLETED: 'Cảm ơn bạn đã đặt hàng!',
      CANCELLED: 'Đơn hàng của bạn đã bị hủy'
    };

    await this.sendToUser(order.userId, {
      title: 'Coffee Loyalty',
      body: messages[status] || 'Đơn hàng đã cập nhật',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        url: `/orders/${order.id}`
      }
    });
  }
}

export default new PushService();
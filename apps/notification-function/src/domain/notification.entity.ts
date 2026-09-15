export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

export interface NotificationProps {
  id: string;
  itineraryId: string;
  message: string;
  status: NotificationStatus;
  createdAt: Date;
}

export class Notification {
  public readonly id: string;
  public readonly itineraryId: string;
  public readonly message: string;
  public readonly status: NotificationStatus;
  public readonly createdAt: Date;

  constructor(props: NotificationProps) {
    if (!props.itineraryId) {
      throw new Error('itineraryId is required to create a Notification');
    }
    if (!props.message || props.message.trim().length === 0) {
      throw new Error('message is required to create a Notification');
    }
    this.id = props.id;
    this.itineraryId = props.itineraryId;
    this.message = props.message;
    this.status = props.status;
    this.createdAt = props.createdAt;
  }
}

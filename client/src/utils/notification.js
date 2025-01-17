import { notification } from 'antd';

export const toast = {
    success: (message) => {
        notification.success({
            message: 'Success',
            description: message,
            placement: 'topRight',
        });
    },
    error: (message) => {
        notification.error({
            message: 'Error',
            description: message,
            placement: 'topRight',
        });
    },
    info: (message) => {
        notification.info({
            message: 'Info',
            description: message,
            placement: 'topRight',
        });
    },
    warning: (message) => {
        notification.warning({
            message: 'Warning',
            description: message,
            placement: 'topRight',
        });
    },
};

export default toast;

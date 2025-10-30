import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  Box,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Button,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Work,
  Description,
  AttachMoney,
  Assessment,
  Event,
  CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const NotificationCenter = () => {
  const { user, accessToken } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user || !accessToken) return;

    // Initialize Socket.IO connection
    const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      auth: {
        token: accessToken,
      },
    });

    socketInstance.on('connect', () => {
      console.log('✓ Connected to WebSocket server');
    });

    socketInstance.on('disconnect', () => {
      console.log('✗ Disconnected from WebSocket server');
    });

    // Listen to all notification events
    const notificationEvents = [
      'application:update',
      'application:new',
      'job:new',
      'interview:scheduled',
      'payroll:processed',
      'performance:reviewed',
      'attendance:reminder',
    ];

    notificationEvents.forEach((event) => {
      socketInstance.on(event, (data) => {
        console.log('Received notification:', data);
        
        // Add to notifications list
        setNotifications((prev) => [
          {
            id: Date.now(),
            ...data,
            read: false,
          },
          ...prev,
        ].slice(0, 10)); // Keep only last 10 notifications

        // Show toast notification
        toast.success(data.message, {
          icon: getNotificationIcon(data.type),
        });
      });
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [user, accessToken]);

  const getNotificationIcon = (type) => {
    const icons = {
      application_update: '📋',
      new_application: '📝',
      new_job: '💼',
      interview_scheduled: '📅',
      payroll_processed: '💰',
      performance_review: '📊',
      attendance_reminder: '⏰',
    };
    return icons[type] || '🔔';
  };

  const getNotificationMuiIcon = (type) => {
    const icons = {
      application_update: <Description />,
      new_application: <Description />,
      new_job: <Work />,
      interview_scheduled: <Event />,
      payroll_processed: <AttachMoney />,
      performance_review: <Assessment />,
      attendance_reminder: <CheckCircle />,
    };
    return icons[type] || <NotificationsIcon />;
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Box>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: '350px',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllAsRead}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="textSecondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
            {notifications.map((notification, index) => (
              <Box key={notification.id}>
                <ListItem
                  alignItems="flex-start"
                  onClick={() => handleMarkAsRead(notification.id)}
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: notification.read ? 'action.disabled' : 'primary.main' }}>
                      {getNotificationMuiIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        fontWeight={notification.read ? 'normal' : 'bold'}
                      >
                        {notification.message}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="textSecondary">
                        {format(new Date(notification.timestamp), 'MMM dd, HH:mm')}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider variant="inset" component="li" />}
              </Box>
            ))}
          </List>
        )}
      </Menu>
    </Box>
  );
};

export default NotificationCenter;


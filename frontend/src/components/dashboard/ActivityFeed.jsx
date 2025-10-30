import { Box, Typography, Avatar, Chip } from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Work as WorkIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

const ActivityFeed = ({ activities = [] }) => {
  const getIcon = (type) => {
    const icons = {
      user: <PersonAddIcon />,
      job: <WorkIcon />,
      application: <DescriptionIcon />,
      approval: <CheckCircleIcon />,
      rejection: <CancelIcon />,
      info: <InfoIcon />,
    };
    return icons[type] || icons.info;
  };

  const getColor = (type) => {
    const colors = {
      user: 'primary',
      job: 'success',
      application: 'warning',
      approval: 'success',
      rejection: 'error',
      info: 'info',
    };
    return colors[type] || 'default';
  };

  if (activities.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
        No recent activity to display
      </Typography>
    );
  }

  return (
    <Box>
      {activities.map((activity, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            gap: 2,
            py: 2,
            borderBottom: index < activities.length - 1 ? 1 : 0,
            borderColor: 'divider',
          }}
        >
          <Avatar
            sx={{
              bgcolor: `${getColor(activity.type)}.main`,
              width: 40,
              height: 40,
            }}
          >
            {getIcon(activity.type)}
          </Avatar>
          <Box flex={1}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {activity.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {activity.description}
            </Typography>
            <Box mt={0.5}>
              <Typography variant="caption" color="text.secondary">
                {activity.time}
              </Typography>
              {activity.badge && (
                <Chip
                  label={activity.badge}
                  size="small"
                  color={getColor(activity.type)}
                  sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                />
              )}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default ActivityFeed;


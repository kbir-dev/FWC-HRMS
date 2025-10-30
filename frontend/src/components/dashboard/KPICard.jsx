import { Card, CardContent, Typography, Box } from '@mui/material';

const KPICard = ({ title, children, action }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {action && <Box>{action}</Box>}
        </Box>
        <Box>{children}</Box>
      </CardContent>
    </Card>
  );
};

export default KPICard;


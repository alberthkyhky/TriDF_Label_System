import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import axios from 'axios';
import { supabase } from '../lib/supabase';

const Dashboard: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<string>('Checking...');
  const [supabaseStatus, setSupabaseStatus] = useState<string>('Checking...');

  useEffect(() => {
    // Test API connection
    const testAPI = async () => {
      try {
        await axios.get(`${process.env.REACT_APP_API_URL}/health`);
        setApiStatus('✅ Connected');
      } catch {
        setApiStatus('❌ Failed to connect');
      }
    };

    // Test Supabase connection
    const testSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('_supabase_migrations')
          .select('*')
          .limit(1);
        if (error && error.code === 'PGRST116') {
          setSupabaseStatus('✅ Connected (no tables yet)');
        } else {
          setSupabaseStatus('✅ Connected');
        }
      } catch {
        setSupabaseStatus('❌ Failed to connect');
      }
    };

    testAPI();
    testSupabase();
  }, []);

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Welcome to Labeling System
      </Typography>

      <Grid container spacing={3}>
        {/* 不再需要 item */}
        <Grid size={{ xs: 12,md:6 }}>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backend API Status
              </Typography>
              <Typography variant="body1">{apiStatus}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12,md:6 }}>
        <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Supabase Status
              </Typography>
              <Typography variant="body1">{supabaseStatus}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12}}>
        <Alert severity="info">
            🚀 Your labeling system is ready for development! Next up: database schema setup.
          </Alert>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;

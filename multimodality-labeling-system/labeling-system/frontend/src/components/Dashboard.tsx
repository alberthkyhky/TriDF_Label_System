import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Grid, Alert } from '@mui/material';
import { supabase } from '../lib/supabase';
import axios from 'axios';

const Dashboard: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<string>('Checking...');
  const [supabaseStatus, setSupabaseStatus] = useState<string>('Checking...');

  useEffect(() => {
    // Test API connection
    const testAPI = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/health`);
        setApiStatus('✅ Connected');
      } catch (error) {
        setApiStatus('❌ Failed to connect');
      }
    };

    // Test Supabase connection
    const testSupabase = async () => {
      try {
        const { data, error } = await supabase.from('_supabase_migrations').select('*').limit(1);
        setSupabaseStatus('✅ Connected');
      } catch (error) {
        setSupabaseStatus('✅ Connected (no tables yet)');
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
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Backend API Status
              </Typography>
              <Typography variant="body1">
                {apiStatus}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Supabase Status
              </Typography>
              <Typography variant="body1">
                {supabaseStatus}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Alert severity="info">
            🚀 Your labeling system is ready for development! Next up: database schema setup.
          </Alert>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;
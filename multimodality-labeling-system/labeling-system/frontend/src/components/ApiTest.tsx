// Create this as a temporary test component: components/ApiTest.tsx
import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Alert, Paper } from '@mui/material';
import { api } from '../services/api';

const ApiTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState('d00910f1-1cda-4ce2-ae65-a90824467dae'); // From your error
  const [userId, setUserId] = useState('f649faea-46af-45fa-8bd9-da06a9f71c97'); // From your error

  const testAssignAPI = async () => {
    setLoading(true);
    setResult('Testing...');

    try {
      // Test 1: Check what the backend expects
      const response1 = await fetch('http://localhost:8000/api/v1/tasks/label-classes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      let labelClasses: string | any[] = [];
      if (response1.ok) {
        labelClasses = await response1.json();
        setResult(prev => prev + `\n✅ Label Classes Found: ${JSON.stringify(labelClasses, null, 2)}`);
      } else {
        setResult(prev => prev + `\n⚠️ Label Classes API failed: ${response1.status}`);
      }

      // Test 2: Try assignment with different formats
      const testCases = [
        {
          name: 'Test with label class IDs (if available)',
          data: {
            user_id_to_assign: userId,
            assigned_classes: labelClasses.length > 0 ? [labelClasses[0].id] : ['general-uuid'],
            target_labels: 5
          }
        },
        {
          name: 'Test with label class names',
          data: {
            user_id_to_assign: userId,
            assigned_classes: ['general'],
            target_labels: 5
          }
        },
        {
          name: 'Test with empty classes (to see exact error)',
          data: {
            user_id_to_assign: userId,
            assigned_classes: [],
            target_labels: 5
          }
        }
      ];

      for (const testCase of testCases) {
        try {
          setResult(prev => prev + `\n\n🧪 ${testCase.name}:`);
          setResult(prev => prev + `\nPayload: ${JSON.stringify(testCase.data, null, 2)}`);
          
          const response = await fetch(`http://localhost:8000/api/v1/tasks/${taskId}/assign`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(testCase.data)
          });

          const responseText = await response.text();
          
          if (response.ok) {
            setResult(prev => prev + `\n✅ SUCCESS: ${responseText}`);
            break; // Stop testing once we find a working format
          } else {
            setResult(prev => prev + `\n❌ FAILED (${response.status}): ${responseText}`);
          }
        } catch (error) {
          setResult(prev => prev + `\n💥 ERROR: ${error}`);
        }
      }

    } catch (error) {
      setResult(prev => prev + `\n💥 GENERAL ERROR: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetTasks = async () => {
    setLoading(true);
    setResult('Fetching tasks...');

    try {
      const tasks = await api.getTasks();
      setResult(`✅ Tasks fetched successfully:\n${JSON.stringify(tasks, null, 2)}`);
    } catch (error) {
      setResult(`❌ Failed to fetch tasks: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetUsers = async () => {
    setLoading(true);
    setResult('Fetching users...');

    try {
      const users = await api.getUsersByRole('labeler');
      setResult(`✅ Users fetched successfully:\n${JSON.stringify(users, null, 2)}`);
    } catch (error) {
      setResult(`❌ Failed to fetch users: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        API Assignment Test
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Task ID"
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          fullWidth
          sx={{ mb: 1 }}
        />
        <TextField
          label="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          fullWidth
        />
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button 
          variant="contained" 
          onClick={testGetTasks}
          disabled={loading}
        >
          Test Get Tasks
        </Button>
        <Button 
          variant="contained" 
          onClick={testGetUsers}
          disabled={loading}
        >
          Test Get Users
        </Button>
        <Button 
          variant="contained" 
          color="warning"
          onClick={testAssignAPI}
          disabled={loading}
        >
          Test Assignment API
        </Button>
      </Box>

      <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
        <Typography variant="h6">Test Results:</Typography>
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          fontFamily: 'monospace', 
          fontSize: '12px',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          {result || 'Click a test button to start...'}
        </pre>
      </Paper>

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Debugging Steps:</strong><br/>
          1. First test "Get Tasks" and "Get Users" to ensure basic API works<br/>
          2. Then test "Assignment API" to see what format the backend expects<br/>
          3. Check if assigned_classes needs UUIDs or names<br/>
          4. Look at the exact error messages to understand the schema
        </Typography>
      </Alert>
    </Box>
  );
};

export default ApiTest;
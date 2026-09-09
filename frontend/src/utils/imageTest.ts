import { API_CONFIG } from '../config/api';

export const testImageUrls = () => {
  console.log('=== IMAGE URL TESTING ===');
  
  // Test API Configuration
  console.log('API_CONFIG.BASE_URL:', API_CONFIG.BASE_URL);
  
  const baseServerUrl = API_CONFIG.BASE_URL.replace('/api', '');
  console.log('Base Server URL (without /api):', baseServerUrl);
  
  // Test various photo path formats
  const testCases = [
    // Actual filenames from the uploads folder
    'property_9bc50dfc-99f6-4c2e-a98a-c6e55488fe95_1779734219_0.jpg',
    'property_9ef34879-04f3-49ca-81f6-fb0763f3e520_1788927814_0.png',
    '/uploads/property_9bc50dfc-99f6-4c2e-a98a-c6e55488fe95_1779734219_0.jpg',
    'uploads/property_9bc50dfc-99f6-4c2e-a98a-c6e55488fe95_1779734219_0.jpg',
    // Legacy format
    'some-old-image.jpg',
    // Complete URLs
    'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg',
    'http://localhost:8080/uploads/test.jpg',
  ];
  
  console.log('\nTesting different photo path formats:');
  testCases.forEach((photo, index) => {
    let finalUrl = '';
    
    if (photo.startsWith('http://') || photo.startsWith('https://') || photo.startsWith('data:')) {
      finalUrl = photo;
    } else if (photo.startsWith('/uploads/')) {
      finalUrl = `${baseServerUrl}${photo}`;
    } else if (photo.startsWith('uploads/')) {
      finalUrl = `${baseServerUrl}/${photo}`;
    } else if (photo.includes('/uploads/')) {
      finalUrl = `${baseServerUrl}${photo}`;
    } else {
      finalUrl = `${baseServerUrl}/uploads/${photo}`;
    }
    
    console.log(`${index + 1}. "${photo}" => "${finalUrl}"`);
  });
  
  // Test if we can reach the backend
  console.log('\nTesting backend connectivity...');
  
  // Test basic backend health
  fetch(`${baseServerUrl}/api/health`)
    .then(response => {
      console.log('Backend health check:', response.ok ? 'SUCCESS' : `FAILED (${response.status})`);
    })
    .catch(error => {
      console.log('Backend health check: FAILED', error.message);
    });
  
  // Test image serving endpoint
  const testImageUrl = `${baseServerUrl}/uploads/property_9bc50dfc-99f6-4c2e-a98a-c6e55488fe95_1779734219_0.jpg`;
  console.log('Testing image URL:', testImageUrl);
  
  fetch(testImageUrl)
    .then(response => {
      console.log('Image fetch test:', response.ok ? 'SUCCESS' : `FAILED (${response.status})`);
      console.log('Content-Type:', response.headers.get('content-type'));
    })
    .catch(error => {
      console.log('Image fetch test: FAILED', error.message);
    });
};

// Function to test a specific property's image URL
export const testPropertyImageUrl = (property: any) => {
  console.log('=== PROPERTY IMAGE URL TEST ===');
  console.log('Property ID:', property.id);
  console.log('Property photos:', property.photos);
  console.log('Property images:', property.images);
  
  const photo = property.photos?.[0] || property.images?.[0];
  console.log('Selected photo:', photo);
  
  if (!photo) {
    console.log('No photo found, using fallback');
    return 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg';
  }
  
  const baseServerUrl = API_CONFIG.BASE_URL.replace('/api', '');
  let finalUrl = '';
  
  if (photo.startsWith('http://') || photo.startsWith('https://') || photo.startsWith('data:')) {
    finalUrl = photo;
    console.log('Using complete URL as-is');
  } else if (photo.startsWith('/uploads/')) {
    finalUrl = `${baseServerUrl}${photo}`;
    console.log('Photo has /uploads/ prefix');
  } else if (photo.startsWith('uploads/')) {
    finalUrl = `${baseServerUrl}/${photo}`;
    console.log('Photo has uploads/ prefix (no leading slash)');
  } else if (photo.includes('/uploads/')) {
    finalUrl = `${baseServerUrl}${photo}`;
    console.log('Photo contains /uploads/ somewhere');
  } else {
    finalUrl = `${baseServerUrl}/uploads/${photo}`;
    console.log('Photo is just filename, adding /uploads/ prefix');
  }
  
  console.log('Final URL:', finalUrl);
  console.log('================================');
  
  return finalUrl;
};
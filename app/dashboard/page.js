const fetchResults = async () => {
  setLoading(true);
  try {
    const username = sessionStorage.getItem('jnanasudha_username');
    const password = sessionStorage.getItem('jnanasudha_password');
    const cookies = sessionStorage.getItem('jnanasudha_cookies') || '';
    
    if (!username || !password) {
      throw new Error('Credentials not found');
    }

    const response = await fetch('/api/fetch-results', {
      headers: {
        'x-username': username,
        'x-password': password,
        'x-cookies': cookies,
      }
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('Error:', data.error);
      setShowData(false);
      setResults([]);
      return;
    }
    
    setResults(data);
    setShowData(true);
  } catch (error) {
    console.error('Fetch error:', error);
    setResults([]);
    setShowData(false);
  }
  setLoading(false);
};
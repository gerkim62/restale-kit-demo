const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function runTests() {
  console.log('Starting Todo API verification tests...');
  console.log(`Target API URL: ${API_URL}`);

  const timestamp = Date.now();
  const userA = {
    username: `test_user_a_${timestamp}`,
    password: `password_a_${timestamp}`
  };
  const userB = {
    username: `test_user_b_${timestamp}`,
    password: `password_b_${timestamp}`
  };

  let tokenA, tokenB;
  let todoAId, todoBId;

  try {
    // 1. Health check
    console.log('\n[Test 1] Verifying server health endpoint...');
    const healthRes = await fetch(`${API_URL.replace('/api', '')}/health`);
    if (!healthRes.ok) throw new Error('Health check failed');
    const healthData = await healthRes.json();
    console.log('✓ Health check status:', healthData.status);

    // 2. Register User A
    console.log('\n[Test 2] Registering User A...');
    const regARes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userA)
    });
    const regAData = await regARes.json();
    if (regARes.status !== 201) {
      throw new Error(`Failed to register User A: ${JSON.stringify(regAData)}`);
    }
    tokenA = regAData.token;
    console.log(`✓ Registered User A: ${regAData.user.username}`);

    // 3. Register User B
    console.log('[Test 3] Registering User B...');
    const regBRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userB)
    });
    const regBData = await regBRes.json();
    if (regBRes.status !== 201) {
      throw new Error(`Failed to register User B: ${JSON.stringify(regBData)}`);
    }
    tokenB = regBData.token;
    console.log(`✓ Registered User B: ${regBData.user.username}`);

    // 4. Test Login User A
    console.log('\n[Test 4] Verifying login for User A...');
    const loginARes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userA)
    });
    const loginAData = await loginARes.json();
    if (loginARes.status !== 200) {
      throw new Error(`Failed to login User A: ${JSON.stringify(loginAData)}`);
    }
    console.log('✓ Login User A successful');

    // 5. Create Todo for User A
    console.log('\n[Test 5] Creating Todo for User A...');
    const createARes = await fetch(`${API_URL}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ title: 'Buy milk' })
    });
    const createAData = await createARes.json();
    if (createARes.status !== 201) {
      throw new Error(`Failed to create Todo for User A: ${JSON.stringify(createAData)}`);
    }
    todoAId = createAData.id;
    console.log(`✓ Todo A created: "${createAData.title}" (ID: ${todoAId})`);

    // 6. Create Todo for User B
    console.log('[Test 6] Creating Todo for User B...');
    const createBRes = await fetch(`${API_URL}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({ title: 'Walk the dog' })
    });
    const createBData = await createBRes.json();
    if (createBRes.status !== 201) {
      throw new Error(`Failed to create Todo for User B: ${JSON.stringify(createBData)}`);
    }
    todoBId = createBData.id;
    console.log(`✓ Todo B created: "${createBData.title}" (ID: ${todoBId})`);

    // 7. Get Todos for User A (Ensure User A cannot see User B's todo)
    console.log('\n[Test 7] Fetching Todos for User A (checking isolation)...');
    const getARes = await fetch(`${API_URL}/todos`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const getAData = await getARes.json();
    if (getARes.status !== 200) {
      throw new Error(`Failed to fetch User A's todos: ${JSON.stringify(getAData)}`);
    }
    const hasTodoA = getAData.some(t => t.id === todoAId);
    const hasTodoBInA = getAData.some(t => t.id === todoBId);
    console.log(`  - Contains own Todo A: ${hasTodoA ? 'YES (Correct)' : 'NO (Error)'}`);
    console.log(`  - Contains other's Todo B: ${hasTodoBInA ? 'YES (Error)' : 'NO (Correct)'}`);
    if (!hasTodoA || hasTodoBInA) {
      throw new Error('Data isolation failed on fetch for User A');
    }
    console.log('✓ User A todos fetched successfully and isolated');

    // 8. Try to Update User A's Todo using User B's Token (Ensure Forbidden/Not Found)
    console.log(`\n[Test 8] Attempting to update User A's Todo (ID: ${todoAId}) using User B's Token...`);
    const hackUpdateRes = await fetch(`${API_URL}/todos/${todoAId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({ title: 'Hacked title', completed: true })
    });
    console.log(`  - Response status code: ${hackUpdateRes.status}`);
    if (hackUpdateRes.status !== 404) {
      throw new Error(`Expected 404 Not Found when trying to update another user's todo, got ${hackUpdateRes.status}`);
    }
    console.log('✓ Access to update other user\'s todo denied (404 Not Found)');

    // 9. Try to Delete User A's Todo using User B's Token (Ensure Forbidden/Not Found)
    console.log(`[Test 9] Attempting to delete User A's Todo (ID: ${todoAId}) using User B's Token...`);
    const hackDeleteRes = await fetch(`${API_URL}/todos/${todoAId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    console.log(`  - Response status code: ${hackDeleteRes.status}`);
    if (hackDeleteRes.status !== 404) {
      throw new Error(`Expected 404 Not Found when trying to delete another user's todo, got ${hackDeleteRes.status}`);
    }
    console.log('✓ Access to delete other user\'s todo denied (404 Not Found)');

    // 10. Update own Todo
    console.log('\n[Test 10] Updating User A\'s own Todo...');
    const updateARes = await fetch(`${API_URL}/todos/${todoAId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({ title: 'Buy chocolate milk instead', completed: true })
    });
    const updateAData = await updateARes.json();
    if (updateARes.status !== 200) {
      throw new Error(`Failed to update Todo: ${JSON.stringify(updateAData)}`);
    }
    console.log(`✓ Todo A updated: "${updateAData.title}" (Completed: ${updateAData.completed})`);

    // 11. Delete own Todo
    console.log('[Test 11] Deleting User A\'s own Todo...');
    const deleteARes = await fetch(`${API_URL}/todos/${todoAId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    if (deleteARes.status !== 200) {
      const deleteAData = await deleteARes.json();
      throw new Error(`Failed to delete Todo: ${JSON.stringify(deleteAData)}`);
    }
    console.log('✓ Todo A deleted successfully');

    // Double check that Todo A is gone
    const checkDeleteARes = await fetch(`${API_URL}/todos`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const checkDeleteAData = await checkDeleteARes.json();
    if (checkDeleteAData.some(t => t.id === todoAId)) {
      throw new Error('Todo A still exists after deletion');
    }
    console.log('✓ Verified Todo A deletion from list');

    console.log('\n======================================');
    console.log('ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('======================================');
  } catch (error) {
    console.error('\n❌ Verification test failed!');
    console.error(error.message || error);
    process.exit(1);
  }
}

runTests();

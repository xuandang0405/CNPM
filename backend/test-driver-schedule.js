const BASE_URL = 'http://localhost:25565/api';

async function testDriverSchedule() {
    try {
        console.log('🔐 Logging in as driver...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'taixe1@gmail.com',
                password: '123456'
            })
        });

        const loginData = await loginRes.json();
        console.log('Login response:', loginData);
        
        if (!loginData.token) {
            throw new Error('Login failed: ' + JSON.stringify(loginData));
        }
        
        const token = loginData.token;
        console.log('✓ Login successful, token:', token.substring(0, 20) + '...');

        console.log('\n📅 Fetching driver schedule...');
        const scheduleRes = await fetch(`${BASE_URL}/trips/my-schedule`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const scheduleData = await scheduleRes.json();
        console.log('✓ Schedule response:', JSON.stringify(scheduleData, null, 2));

        if (scheduleData.schedules && scheduleData.schedules.length > 0) {
            const scheduleId = scheduleData.schedules[0].schedule_id;
            console.log(`\n👨‍🎓 Fetching students for schedule ${scheduleId}...`);
            
            const studentsRes = await fetch(`${BASE_URL}/trips/schedule/${scheduleId}/students`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const studentsData = await studentsRes.json();
            console.log('✓ Students response:', JSON.stringify(studentsData, null, 2));
        }

        console.log('\n✅ All tests passed!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testDriverSchedule();

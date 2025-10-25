// Debug script - Paste vào Browser Console để kiểm tra token và user

console.log('=== DEBUG TOKEN & USER ===');

// 1. Check token
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
if (token) {
    console.log('Token preview:', token.substring(0, 30) + '...');
    
    // Decode JWT (phần payload)
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decoded = JSON.parse(jsonPayload);
        console.log('Token payload:', decoded);
        console.log('Token role:', decoded.role);
        console.log('Token expired?', decoded.exp ? new Date(decoded.exp * 1000) < new Date() : 'No expiry');
    } catch (e) {
        console.error('Cannot decode token:', e);
    }
} else {
    console.log('❌ NO TOKEN - You need to login!');
}

// 2. Check user in localStorage
const userStr = localStorage.getItem('user');
console.log('\nUser exists:', !!userStr);
if (userStr) {
    try {
        const user = JSON.parse(userStr);
        console.log('User:', user);
        console.log('User role:', user.role);
        console.log('User ID:', user.id);
    } catch (e) {
        console.error('Cannot parse user:', e);
    }
} else {
    console.log('❌ NO USER - You need to login!');
}

// 3. Check current page
console.log('\nCurrent page:', window.location.pathname);

// 4. Suggest fix
console.log('\n=== SUGGESTED FIX ===');
if (!token) {
    console.log('1. Clear localStorage: localStorage.clear()');
    console.log('2. Reload page');
    console.log('3. Click "Fill admin & login"');
} else {
    console.log('Token exists. If still getting 403:');
    console.log('1. Check token role is "admin" or "driver"');
    console.log('2. If role is "parent", admin features are forbidden');
    console.log('3. Try: localStorage.clear() then login as admin');
}

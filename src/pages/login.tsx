// Import useAuth from context
import { useAuth } from '../Contexts/AuthContext';

// Destructure login and logout functions.
const { login, logout } = useAuth();

...

return (
    <div>
        <button onClick={login}> Login </button>
        <button onClick={logout}> Logout </button>
    </div>
);

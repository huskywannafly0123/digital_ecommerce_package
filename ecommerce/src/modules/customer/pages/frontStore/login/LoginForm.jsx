export default function LoginForm({
    action,
    homeUrl,
    registerUrl,
    forgotPasswordUrl,
}){
    const [error, setError] = useState(null);

    return (
        <div className="flex justify-center items-center">
            <div className="login-form flex justify-center items-center">
                <div className="login-form-inner">
                    <h1 className="text-center">{_("Login")}</h1>
                    {error && <div className="text-critical mb-4">{error}</div>}
                </div>
            </div>
        </div>
    )
}
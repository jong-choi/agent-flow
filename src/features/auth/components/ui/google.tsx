function GoogleIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className="block"
      {...props}
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}

function GoogleSignInButton({
  children = "Continue with Google",
  className = "",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      className={`relative box-border h-10 w-auto max-w-[400px] min-w-min cursor-pointer appearance-none overflow-hidden rounded-[20px] border border-[#747775] bg-white px-3 text-center align-middle font-["Roboto",arial,sans-serif] text-sm font-medium tracking-[0.25px] whitespace-nowrap text-[#1f1f1f] transition-all duration-218 ease-in-out outline-none select-none hover:shadow-[0_1px_2px_0_rgba(60,64,67,.30),0_1px_3px_1px_rgba(60,64,67,.15)] disabled:cursor-default disabled:border-[#1f1f1f1f] disabled:bg-[#ffffff61] dark:border-[#8e918f] dark:bg-[#131314] dark:text-[#e3e3e3] dark:disabled:border-[#8e918f1f] dark:disabled:bg-[#13131461] ${className} `}
      {...props}
    >
      <div className="absolute inset-0 bg-[#303030] opacity-0 transition-opacity duration-218 hover:opacity-[0.08] focus:opacity-[0.12] active:opacity-[0.12] disabled:bg-[#1f1f1f1f] dark:bg-white dark:disabled:bg-[#e3e3e31f]" />
      <div className="relative flex h-full w-full items-center justify-between">
        <div className="mr-3 h-5 w-5 min-w-5 disabled:opacity-[0.38]">
          <GoogleIcon />
        </div>
        <span className="grow overflow-hidden align-top text-ellipsis disabled:opacity-[0.38]">
          {children}
        </span>
        <span className="hidden">{children}</span>
      </div>
    </button>
  );
}

export { GoogleSignInButton, GoogleIcon };

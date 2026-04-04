export default function AppLogo() {
  return (
    <>
      <img
        src="/images/logo.svg"
        alt="myFish"
        className="h-8 w-auto dark:hidden"
      />
      <img
        src="/images/logo-dark.svg"
        alt="myFish"
        className="hidden h-8 w-auto dark:block"
      />
    </>
  );
}

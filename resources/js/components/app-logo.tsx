export default function AppLogo() {
  return (
    <>
      <img
        src="/media/brand/logo.svg"
        alt="myFish"
        className="h-8 w-auto dark:hidden"
      />
      <img
        src="/media/brand/logo-dark.svg"
        alt="myFish"
        className="hidden h-8 w-auto dark:block"
      />
    </>
  );
}

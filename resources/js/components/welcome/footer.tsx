import { WeightConverterDialog } from "@/components/WeightConverterDialog";

type Props = {
  kgToLbsRate: number;
};

export function WelcomeFooter({ kgToLbsRate }: Props) {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          MyFish — Fresh fish, Solomon Islands
        </p>
        <div className="mt-2">
          <WeightConverterDialog kgToLbsRate={kgToLbsRate} />
        </div>
      </div>
    </footer>
  );
}

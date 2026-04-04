import {
  CancelCircleIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Package01Icon,
  PackageDelivered01Icon,
  PauseCircleIcon,
} from "@hugeicons/core-free-icons";

type IconSvgElement = readonly (readonly [
  string,
  { readonly [key: string]: string | number },
])[];

export const ORDER_STATUS_ICONS: Record<string, IconSvgElement> = {
  Clock01Icon,
  CheckmarkCircle01Icon,
  PauseCircleIcon,
  CancelCircleIcon,
  Package01Icon,
  PackageDelivered01Icon,
};

import { PlusIcon } from "@heroicons/react/20/solid";
import { Button } from "./button";
import { Heading } from "./heading";
import { Text } from "./text";

export function Empty({
  title,
  description,
  button,
  onClick,
}: {
  title: string;
  description: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <div className="text-center">
      <svg
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="mx-auto h-12 w-12 text-gray-400"
      >
        <path
          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <Heading level={3}>{title}</Heading>
      <Text>{description}</Text>
      <div className="mt-6">
        <Button type="button" onClick={onClick}>
          <PlusIcon aria-hidden="true" className="-ml-0.5 mr-1.5 h-5 w-5" />
          {button}
        </Button>
      </div>
    </div>
  );
}

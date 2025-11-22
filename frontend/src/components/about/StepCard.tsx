const StepCard = ({
  number,
  title,
  text,
}: {
  number: number;
  title: string;
  text: string;
}) => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm text-left">
    <div className="text-xs font-semibold text-amber-500 mb-1">
      Step {number}
    </div>
    <h3 className="font-semibold text-neutral-900 text-lg">{title}</h3>
    <p className="text-sm text-neutral-600 mt-1">{text}</p>
  </div>
);

export default StepCard;

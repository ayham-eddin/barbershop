import clsx from "clsx";

interface SectionProps {
  className?: string;
  spaceY?: "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";
  id?: string;
  dataAos?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ className, children, dataAos, spaceY="6"}) => {
  return (
    <section className={clsx(`space-y-${spaceY}`, className)} data-aos={dataAos}>
      {children}
    </section>
  );
};

export default Section;

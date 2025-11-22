import Card from "../ui/Card";

const ContactMap = () => {
  return (
    <div className="space-y-4">
      <Card title="Location" subtitle="Find us on the map">
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <iframe
            title="Barbershop location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2510.767570880438!2d6.782!3d51.224!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47b8c0a903000001%3A0x0000000000000000!2sD%C3%BCsseldorf%20City!5e0!3m2!1sen!2sde!4v1700000000000"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-64"
          />
        </div>
      </Card>
    </div>
  );
};
export default ContactMap;

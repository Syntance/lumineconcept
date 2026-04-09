"use client";

export function DeliveryInfoBlock() {
  return (
    <div className="mt-6">
      <div className="bg-brand-100 p-5 lg:p-6 space-y-3 text-base leading-relaxed text-brand-700">
        <p>
          Czas realizacji zamówienia to <strong>około 10 dni roboczych</strong>
          <br />
          lub <strong>3 dni robocze</strong> z opcją ekspress.
        </p>
        <p>
          <strong>Kurier DPD</strong> — przesyłka kurierska dostarczona pod wskazany adres, koszt od{" "}
          <strong>25 zł</strong>.
        </p>
      </div>
    </div>
  );
}

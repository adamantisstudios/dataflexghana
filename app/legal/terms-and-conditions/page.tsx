export default async function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-primary">Terms and Conditions</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-secondary">Delivery & Service Information</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Does it really take long to deliver data?</h3>
              <p className="text-muted-foreground mb-3">
                Delivery usually takes 10 minutes and upwards, depending on several factors:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
                <li>
                  <strong>Time of Order</strong> - Orders placed early morning (6–10am) are typically processed faster.
                  Between 11am–4pm, delivery may take up to an hour or more. From 5pm–9pm, it may vary — sometimes under
                  an hour, sometimes longer.
                </li>
                <li>
                  <strong>Network Conditions</strong> - Network providers occasionally perform maintenance, upgrades, or
                  system audits, which can slow down delivery.
                </li>
                <li>
                  <strong>Operational Hours</strong> - Data delivery may halt or slow after business hours. We're
                  generally closed from 9:50pm to 6am, so orders placed during this period will process after we reopen.
                </li>
              </ul>
              <p className="text-muted-foreground mt-3">
                We also operate on Sundays, but Sunday delivery may or may not be fast.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Platform Entry Fee & Registration</h3>
              <ol className="list-decimal list-inside space-y-3 text-muted-foreground ml-2">
                <li>
                  <strong>Platform Entry Fee</strong> - Dataflex Ghana is not a free platform. To gain access, you are
                  required to pay a Platform Entry Fee — think of it as a gate fee you pay to watch a movie. Without
                  payment, access cannot be granted.
                </li>
                <li>
                  <strong>Registration Responsibility</strong> - We have provided all necessary information to guide and
                  educate potential members before registration. This includes a clear notice that if you are not ready
                  to make payment, please do not register. Despite these instructions, some still register without
                  paying. Please note that such accounts will be blocked and denied access to the platform.
                </li>
                <li>
                  <strong>Payment Timeline</strong> - After registration, you have one (1) hour to complete your
                  Platform Entry Fee payment. Failure to do so within this period will result in automatic denial of
                  access. Kindly take this seriously.
                </li>
                <li>
                  <strong>Our Vision and Services</strong> - Dataflex Ghana has partnered with numerous businesses and
                  companies nationwide, offering over 50 services. Our platform was not built solely for data sales —
                  it's a full-fledged business ecosystem. We encourage only serious and committed individuals to join
                  us.
                </li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Instant Delivery Options</h3>
              <p className="text-muted-foreground">
                If the client wants data instantly, advise them to buy it directly from MTN or their network provider.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Stay Updated</h3>
              <p className="text-muted-foreground">
                Please follow updates in our channel for the latest information and announcements.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

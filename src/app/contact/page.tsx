import { SectionHeader } from '@/components/common/SectionHeader';
import { ClientContactForm } from '@/components/common/ClientContactForm';
import { Image } from '@/components/common/Image';
import { getPageHeader } from '@/utils/pageHeaders';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with MTP Collective for photography inquiries, event coverage, or collaboration opportunities. We specialize in sports, music, and street photography.',
  openGraph: {
    title: 'Contact Us | MTP Collective',
    description: 'Get in touch with MTP Collective for photography inquiries and event coverage.',
  },
};

export default async function ContactPage() {
  const heroImage = await getPageHeader('contact');
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative w-full" style={{ height: '40vh' }}>
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt="Contact MTP Collective"
            fill
            priority
            sizes="100vw"
            className="brightness-75"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Contact Us
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 font-light">
              Get in touch with our team
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl ml-0 sm:ml-1 mr-auto pr-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <SectionHeader
                title="Get in Touch"
                subtitle="We'd love to hear from you. Send us a message and we'll respond as soon as possible."
                align="left"
              />
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Email</h3>
                  <p className="text-gray-300">
                    <a
                      href="mailto:contact@mtpcollective.com"
                      className="hover:text-white transition-colors"
                    >
                      contact@mtpcollective.com
                    </a>
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Phone</h3>
                  <p className="text-gray-300">
                    <a
                      href="tel:+1234567890"
                      className="hover:text-white transition-colors"
                    >
                      (123) 456-7890
                    </a>
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Location</h3>
                  <p className="text-gray-300">
                    123 Photography Street
                    <br />
                    City, State 12345
                    <br />
                    United States
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Follow Us</h3>
                  <div className="flex space-x-4">
<a
                                      href="https://www.instagram.com/monkey_take_photo/"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-gray-400 hover:text-white transition-colors"
                                    >
                      <span className="sr-only">Instagram</span>
                      <svg
                        className="h-6 w-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <ClientContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 
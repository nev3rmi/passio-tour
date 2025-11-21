import Link from 'next/link'
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Heart } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    {
      title: 'Explore',
      links: [
        { href: '/tours', label: 'All Tours' },
        { href: '/destinations', label: 'Destinations' },
        { href: '/about', label: 'About Us' },
        { href: '/blog', label: 'Blog' }
      ]
    },
    {
      title: 'Support',
      links: [
        { href: '/help', label: 'Help Center' },
        { href: '/contact', label: 'Contact' },
        { href: '/faq', label: 'FAQ' },
        { href: '/terms', label: 'Terms of Service' }
      ]
    },
    {
      title: 'Company',
      links: [
        { href: '/about', label: 'About' },
        { href: '/careers', label: 'Careers' },
        { href: '/partners', label: 'Partners' },
        { href: '/press', label: 'Press' }
      ]
    }
  ]

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Mail, href: '#', label: 'Email' }
  ]

  const contactInfo = [
    { icon: Phone, text: '+1 (555) 123-4567', href: 'tel:+15551234567' },
    { icon: Mail, text: 'info@passiotour.com', href: 'mailto:info@passiotour.com' },
    { icon: MapPin, text: '123 Tourist Street, Bangkok, Thailand', href: '#' }
  ]

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-xl font-bold">Passio Tour</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-xs">
              Your trusted partner for unforgettable travel experiences in Thailand and beyond.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-lg font-semibold mb-4 text-white">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-blue-400 transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Stay Updated
            </h3>
            <p className="text-gray-400 mb-4">
              Get the latest travel tips and exclusive offers delivered to your inbox.
            </p>
            <form className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-400 text-center md:text-left">
              © {currentYear} Passio Tour. All rights reserved.
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info Bar */}
      <div className="border-t border-gray-800 bg-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            {contactInfo.map((info, index) => (
              <div key={index} className="flex items-center space-x-2">
                <info.icon className="h-4 w-4 text-blue-400" />
                {info.href.startsWith('tel:') || info.href.startsWith('mailto:') ? (
                  <a
                    href={info.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {info.text}
                  </a>
                ) : (
                  <span className="text-gray-400">{info.text}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
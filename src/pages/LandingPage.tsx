import React from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <svg
              className="h-8 w-8 text-blue-800"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <h1 className="ml-2 text-xl font-bold text-gray-800">ASESORÍA CONTABLE</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#inicio" className="text-gray-600 hover:text-blue-800">Inicio</a>
            <a href="#quienes-somos" className="text-gray-600 hover:text-blue-800">Quiénes Somos</a>
            <a href="#servicios" className="text-gray-600 hover:text-blue-800">Servicios</a>
            <a href="#contacto" className="text-gray-600 hover:text-blue-800">Contáctanos</a>
          </nav>
          <Button
            onClick={() => window.location.href = "/login"}
            className="bg-blue-800 hover:bg-blue-900 text-white"
          >
            Iniciar Sesión
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="bg-blue-800 text-white py-20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h2 className="text-4xl font-bold mb-4">Soluciones contables para tu negocio</h2>
            <p className="text-xl mb-8">
              Ofrecemos servicios contables profesionales para ayudarte a gestionar tus finanzas
              y cumplir con tus obligaciones tributarias.
            </p>
            <div className="flex space-x-4">
              <Button
                onClick={() => document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" })}
                className="bg-white text-blue-800 hover:bg-gray-100"
              >
                Contáctanos
              </Button>
              <Button
                onClick={() => document.getElementById("servicios")?.scrollIntoView({ behavior: "smooth" })}
                variant="outline"
                className="border-white text-black hover:bg-blue-700 hover:text-white"
              >
                Nuestros Servicios
              </Button>
            </div>
          </div>
          <div className="md:w-1/2">
            <img
              src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
              alt="Contabilidad"
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>
      {/* Quiénes Somos */}
      <section id="quienes-somos" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Quiénes Somos</h2>
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-8">
              <img
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
                alt="Equipo de trabajo"
                className="rounded-lg shadow-lg"
              />
            </div>
            <div className="md:w-1/2">
              <h3 className="text-2xl font-semibold mb-4 text-blue-800">Nuestra Misión</h3>
              <p className="text-gray-600 mb-6">
                En Asesoría Contable, nos dedicamos a proporcionar servicios contables y financieros de alta calidad, 
                ayudando a empresas y emprendedores a optimizar sus procesos contables, cumplir con sus obligaciones 
                tributarias y tomar decisiones financieras informadas.
              </p>
              <h3 className="text-2xl font-semibold mb-4 text-blue-800">Nuestra Visión</h3>
              <p className="text-gray-600">
                Ser reconocidos como líderes en asesoría contable, destacándonos por nuestra excelencia, 
                innovación y compromiso con el éxito de nuestros clientes, contribuyendo al desarrollo 
                económico sostenible de las empresas y profesionales que confían en nosotros.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios */}
      <section id="servicios" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Nuestros Servicios</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Contabilidad General</h3>
                <p className="text-gray-600">
                  Llevamos tu contabilidad de manera ordenada y precisa, cumpliendo con todas las normativas vigentes 
                  y proporcionándote informes financieros claros y oportunos.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Asesoría Tributaria</h3>
                <p className="text-gray-600">
                  Te ayudamos a optimizar tu carga tributaria de manera legal, gestionando tus declaraciones 
                  y manteniéndote al día con las obligaciones fiscales.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">Análisis Financiero</h3>
                <p className="text-gray-600">
                  Analizamos tus estados financieros para identificar oportunidades de mejora y 
                  proporcionarte recomendaciones estratégicas para el crecimiento de tu negocio.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contáctanos */}
      <section id="contacto" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Contáctanos</h2>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/2">
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-blue-800">Envíanos un mensaje</h3>
                  <p className="text-gray-600 mb-6">
                    ¿Interesado en nuestros servicios? Completa el formulario y nos pondremos en contacto contigo 
                    para crear una cuenta personalizada y comenzar a trabajar juntos.
                  </p>
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                      <Input placeholder="Tu nombre" className="w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
                      <Input type="email" placeholder="tu@email.com" className="w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <Input placeholder="+51 999 888 777" className="w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                      <Textarea placeholder="¿En qué podemos ayudarte?" className="w-full" rows={4} />
                    </div>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center"
                      onClick={() => window.open(`https://wa.me/51912114417?text=${encodeURIComponent('Hola, estoy interesado en sus servicios de asesoría contable.')}`)}>
                      <svg 
                        className="h-5 w-5 mr-2" 
                        fill="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                      </svg>
                      Contactar por WhatsApp
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            <div className="md:w-1/2">
              <Card className="shadow-lg h-full">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-blue-800">Información de contacto</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="h-5 w-5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Dirección</h4>
                        <p className="text-gray-600">Av. Principal 123, Lima, Perú</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="h-5 w-5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Teléfono</h4>
                        <p className="text-gray-600">+51 1 234 5678</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="h-5 w-5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Correo electrónico</h4>
                        <p className="text-gray-600">contacto@asesoriacontable.com</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="h-5 w-5 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Horario de atención</h4>
                        <p className="text-gray-600">Lunes a Viernes: 9:00 AM - 6:00 PM</p>
                        <p className="text-gray-600">Sábados: 9:00 AM - 1:00 PM</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8">
                    <h4 className="font-medium text-gray-800 mb-2">Síguenos en redes sociales</h4>
                    <div className="flex space-x-4">
                      <a href="#" className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 hover:bg-blue-200 transition-colors">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                        </svg>
                      </a>
                      <a href="#" className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 hover:bg-blue-200 transition-colors">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm5.5 16.5h-2.25v-3.313c0-.844-.019-1.93-1.175-1.93-1.176 0-1.356.918-1.356 1.868v3.375h-2.25v-6.75h2.156v.984h.031c.3-.57 1.038-1.172 2.138-1.172 2.288 0 2.706 1.507 2.706 3.47v3.469zM7.875 9.75a1.313 1.313 0 110-2.625 1.313 1.313 0 010 2.625zm1.125 6.75h-2.25v-6.75h2.25v6.75z" />
                        </svg>
                      </a>
                      <a href="#" className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 hover:bg-blue-200 transition-colors">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <h2 className="ml-2 text-xl font-bold">ASESORÍA CONTABLE</h2>
              </div>
              <p className="mt-2 text-gray-400">
                Soluciones contables profesionales para tu negocio.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-3">Enlaces rápidos</h3>
                <ul className="space-y-2">
                  <li><a href="#inicio" className="text-gray-400 hover:text-white">Inicio</a></li>
                  <li><a href="#quienes-somos" className="text-gray-400 hover:text-white">Quiénes Somos</a></li>
                  <li><a href="#servicios" className="text-gray-400 hover:text-white">Servicios</a></li>
                  <li><a href="#contacto" className="text-gray-400 hover:text-white">Contáctanos</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Servicios</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white">Contabilidad General</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Asesoría Tributaria</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Análisis Financiero</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Consultoría Empresarial</a></li>
                </ul>
              </div>
              <div className="col-span-2 md:col-span-1">
                <h3 className="text-lg font-semibold mb-3">Boletín informativo</h3>
                <p className="text-gray-400 mb-3">
                  Suscríbete para recibir noticias y actualizaciones contables.
                </p>
                <div className="flex">
                  <Input
                    placeholder="Tu correo electrónico"
                    className="rounded-r-none bg-gray-700 border-gray-600 text-white"
                  />
                  <Button className="rounded-l-none bg-blue-800 hover:bg-blue-900">
                    Suscribirse
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <Separator className="my-8 bg-gray-700" />
          <div className="text-center text-gray-400">
            <p>© {new Date().getFullYear()} Asesoría Contable. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

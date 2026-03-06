import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import { QrCode, Utensils, Clock, Star, ChefHat, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage = () => {
  const features = [
    {
      icon: QrCode,
      title: 'Escaneie o QR Code',
      description: 'Cada mesa possui um QR code único. Escaneie para acessar o cardápio digital.'
    },
    {
      icon: Utensils,
      title: 'Faça seu Pedido',
      description: 'Navegue pelo cardápio, escolha seus pratos favoritos e adicione ao carrinho.'
    },
    {
      icon: Clock,
      title: 'Acompanhe em Tempo Real',
      description: 'Receba atualizações sobre o status do seu pedido direto na tela.'
    },
    {
      icon: Star,
      title: 'Experiência Premium',
      description: 'Atendimento rápido e eficiente sem precisar esperar pelo garçom.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Restaurante - Cardápio Digital com QR Code</title>
        <meta name="description" content="Faça seus pedidos de forma rápida e prática através do nosso cardápio digital. Escaneie o QR code da sua mesa e comece agora!" />
      </Helmet>

      <div className="min-h-screen bg-stone-50">
        <Header />

        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1508783296529-be0effe57fd2"
              alt="Interior elegante de restaurante com mesas bem decoradas e iluminação ambiente"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-stone-900/70 via-stone-900/60 to-stone-900/80"></div>
          </div>

          <div className="relative z-10 container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Bem-vindo ao Nosso<br />Restaurante
              </h1>
              <p className="text-xl md:text-2xl text-stone-200 mb-12 max-w-3xl mx-auto">
                Experimente a praticidade do nosso cardápio digital.<br />
                Faça seus pedidos de forma rápida e sem complicações.
              </p>
              <Link to="/menu">
                <Button size="lg" className="text-lg px-8 py-6 gap-3 shadow-2xl hover:shadow-amber-600/50 transition-all">
                  <Smartphone className="w-6 h-6" />
                  Acessar Cardápio
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* QR Code Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
                <QrCode className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-4xl font-bold text-stone-800 mb-6">
                Leia o QR Code da Sua Mesa para Começar
              </h2>
              <p className="text-xl text-stone-600 mb-8 leading-relaxed">
                Cada mesa do nosso restaurante possui um QR code exclusivo.<br />
                Basta escanear com a câmera do seu celular para acessar o cardápio<br />
                e fazer seus pedidos de forma instantânea.
              </p>
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 inline-block">
                <p className="text-lg font-semibold text-amber-800 flex items-center gap-2">
                  <ChefHat className="w-6 h-6" />
                  Sem filas, sem espera. Peça direto da sua mesa!
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-stone-50">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-4xl font-bold text-stone-800 mb-4">
                Como Funciona
              </h2>
              <p className="text-xl text-stone-600">
                Simples, rápido e prático
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white rounded-xl p-6 shadow-lg border border-stone-200 hover:shadow-xl transition-all hover:-translate-y-1"
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
                      <Icon className="w-8 h-8 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-bold text-stone-800 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-stone-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-amber-600 to-amber-700">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold text-white mb-6">
                Pronto para Começar?
              </h2>
              <p className="text-xl text-amber-100 mb-8 max-w-2xl mx-auto">
                Escaneie o QR code da sua mesa ou acesse o cardápio digital agora mesmo
              </p>
              <Link to="/menu">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6 gap-3 shadow-xl">
                  <Smartphone className="w-6 h-6" />
                  Acessar Cardápio Agora
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-stone-800 text-white py-8">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <ChefHat className="w-6 h-6 text-amber-500" />
              <span className="text-xl font-bold">Restaurante</span>
            </div>
            <p className="text-stone-400">
              © 2026 Restaurante. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;
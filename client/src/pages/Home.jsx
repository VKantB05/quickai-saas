import React from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Plan from '../components/Plan'
import AiTools from '../components/AiTools'
import Testimonial from '../components/Testimonial'
import Footer from '../components/Footer'

const Home = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <AiTools />
      <Testimonial />
      <Plan />
      <Footer />
    </>
  )
}

export default Home
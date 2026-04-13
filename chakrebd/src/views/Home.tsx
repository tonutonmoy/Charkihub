import React from 'react';
import Hero from '../components/Hero';
import FeaturedGrid from '../components/FeaturedGrid';
import HomeJobSections from '../components/HomeJobSections';
import HomeBlogPreview from '../components/HomeBlogPreview';
import PreparationSection from '../components/PreparationSection';
import SmartSuggestions from '../components/SmartSuggestions';
import { Stats, Testimonials, Newsletter } from '../components/Sections';

const Home = () => {
  return (
    <>
      <Hero />
      <HomeJobSections />
      <FeaturedGrid />
      <PreparationSection />
      <SmartSuggestions />
      <Stats />
      <HomeBlogPreview />
      <Testimonials />
      <Newsletter />
    </>
  );
};

export default Home;

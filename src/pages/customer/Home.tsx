import HeroSection      from '../../components/home/HeroSection';
import CategorySection  from '../../components/home/CategorySection';
import FeaturedProducts from '../../components/home/FeaturedProducts';
import WhyChooseUs      from '../../components/home/WhyChooseUs';
import AboutSection     from '../../components/home/AboutSection';
import Testimonials     from '../../components/home/Testimonials';
import Newsletter       from '../../components/home/Newsletter';

const Home = () => {
  return (
    <>
      <HeroSection />
      <CategorySection />
      <FeaturedProducts />
      <WhyChooseUs />
      <AboutSection />
      <Testimonials />
      <Newsletter />
    </>
  );
};

export default Home;

import React from 'react';
import { Hero } from '../../sections/Hero/Hero';
import { About } from '../../sections/About/About';
import { Training } from '../../sections/Training/Training';
import { Amenities } from '../../sections/Amenities/Amenities';
import { Gallery } from '../../sections/Gallery/Gallery';
import { BrandStatement } from '../../sections/BrandStatement/BrandStatement';
import { Membership } from '../../sections/Membership/Membership';
import { FreeSession } from '../../sections/FreeSession/FreeSession';
import { Location } from '../../sections/Location/Location';

export const Home: React.FC = () => {
  return (
    <>
      <Hero />
      <About />
      <Training />
      <Amenities />
      <Gallery />
      <BrandStatement />
      <Membership />
      <FreeSession />
      <Location />
    </>
  );
};

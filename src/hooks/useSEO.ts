import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
}

const defaultSEO = {
  title: 'Taqueria Hectorito - Authentic Mexican Restaurant | St. Louis, MO',
  description: 'Taqueria Hectorito offers authentic Mexican tacos on Cherokee Street, St. Louis. Enjoy tacos, burritos, quesadillas and more traditional Mexican dishes.',
  ogImage: '/og-image.jpg',
  ogType: 'website',
};

export const useSEO = ({
  title,
  description,
  canonical,
  ogImage,
  ogType,
}: SEOProps = {}) => {
  useEffect(() => {
    // Update title
    const fullTitle = title 
      ? `${title} | Taqueria Hectorito Mexican Restaurant`
      : defaultSEO.title;
    document.title = fullTitle;

    // Update meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const selector = isProperty 
        ? `meta[property="${name}"]`
        : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    const metaDescription = description || defaultSEO.description;
    const metaOgImage = ogImage || defaultSEO.ogImage;
    const metaOgType = ogType || defaultSEO.ogType;

    // Standard meta tags
    updateMetaTag('description', metaDescription);
    
    // Open Graph tags
    updateMetaTag('og:title', fullTitle, true);
    updateMetaTag('og:description', metaDescription, true);
    updateMetaTag('og:image', metaOgImage, true);
    updateMetaTag('og:type', metaOgType, true);
    
    // Twitter tags
    updateMetaTag('twitter:title', fullTitle);
    updateMetaTag('twitter:description', metaDescription);
    updateMetaTag('twitter:image', metaOgImage);

    // Canonical URL
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    // Cleanup - restore defaults on unmount
    return () => {
      document.title = defaultSEO.title;
    };
  }, [title, description, canonical, ogImage, ogType]);
};

export default useSEO;

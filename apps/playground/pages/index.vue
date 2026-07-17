<template>
  <section>
    <h2>Scenes</h2>
    <ul>
      <li>
        <NuxtLink to="/easing">Rational-cubic easing</NuxtLink>
        — adjust endpoint slopes and curvatures for
        <code>fromSlopesAndCurvatures</code>, scrub along x to read off the eased y.
      </li>
      <li>
        <NuxtLink to="/coordinates">Polar projection</NuxtLink>
        — drag a spline around chart space and watch
        <code>CoordinateSystem.image</code> carry it onto the plane, with winding, origin, and
        radial-map controls, a naive control-point-mapping foil, and
        <code>containsPoint</code> hit-testing.
      </li>
    </ul>
  </section>
</template>

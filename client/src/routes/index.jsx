import {createFileRoute} from "@tanstack/react-router";
import * as React from "react";
import NavbarMain from "../components/NavbarMain";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <>
  <NavbarMain/>
  i fucking hate my life !!
  </>;
}

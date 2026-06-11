import React from "react"
import { render, screen } from "@testing-library/react"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../breadcrumb"

describe("Breadcrumb component", () => {
  test("renders without crashing with a single item", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Home</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
    expect(screen.getByText("Home")).toBeInTheDocument()
  })

  test("renders correctly with two items and a separator", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/trip">תוכנית הטיול</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>יום ראשון</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
    expect(screen.getByText("תוכנית הטיול")).toBeInTheDocument()
    expect(screen.getByText("יום ראשון")).toBeInTheDocument()
  })

  test("renders correctly with three items", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/trip">תוכנית הטיול</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/trip">יום שני</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>בוקר</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
    expect(screen.getByText("תוכנית הטיול")).toBeInTheDocument()
    expect(screen.getByText("יום שני")).toBeInTheDocument()
    expect(screen.getByText("בוקר")).toBeInTheDocument()
  })

  test("BreadcrumbPage has aria-current='page' and is not a link", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Current Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
    const page = screen.getByText("Current Page")
    expect(page).toHaveAttribute("aria-current", "page")
    expect(page.tagName).not.toBe("A")
  })

  test("BreadcrumbLink renders as an anchor with correct href", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/trip">תוכנית הטיול</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
    const link = screen.getByRole("link", { name: "תוכנית הטיול" })
    expect(link).toHaveAttribute("href", "/trip")
  })

  test("nav element has aria-label='breadcrumb'", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Page</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
    expect(screen.getByRole("navigation", { name: "breadcrumb" })).toBeInTheDocument()
  })
})

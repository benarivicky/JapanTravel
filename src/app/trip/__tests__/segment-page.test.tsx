/**
 * Integration test: segment detail page breadcrumb
 *
 * Mocks Firestore and hooks so we can mount the page and verify the
 * breadcrumb renders with the right items, links, and accessibility attrs.
 */
import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"

// ── Module mocks ─────────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({
  useParams: () => ({ date: "2024-03-20", segment: "1" }),
  useRouter: () => ({ replace: jest.fn() }),
  notFound: jest.fn(),
}))

jest.mock("@/hooks/use-trip-id", () => ({
  useTripId: () => ({ tripId: "373", loading: false }),
}))

const mockSegment = {
  id: "seg-1",
  tripId: "373",
  date: "2024-03-20",
  timeSegment: "בוקר",
  timeSegmentNumeric: 1,
  summary: "ביקור במקדש",
  detailedContent: "<p>פרטים על המקדש</p>",
  externalLinks: [],
  city: "Tokyo",
  hotelsDetails: "Shinjuku Hotel",
}

jest.mock("@/lib/database", () => ({
  getTripPlans: jest.fn().mockResolvedValue([mockSegment]),
}))

// ── Test ──────────────────────────────────────────────────────────────────────

// Dynamically import AFTER mocks are set up
let TripSegmentPage: React.ComponentType

beforeAll(async () => {
  const mod = await import("../[date]/[segment]/page")
  TripSegmentPage = mod.default
})

describe("TripSegmentPage — breadcrumb", () => {
  test("renders a breadcrumb with 3 items after data loads", async () => {
    render(<TripSegmentPage />)

    await waitFor(() => {
      expect(screen.getByTestId("breadcrumb-nav")).toBeInTheDocument()
    })

    const nav = screen.getByRole("navigation", { name: "breadcrumb" })
    expect(nav).toBeInTheDocument()
    expect(within(nav).getByText("תוכנית הטיול")).toBeInTheDocument()
    expect(within(nav).getByText("בוקר")).toBeInTheDocument()
  })

  test("'תוכנית הטיול' breadcrumb item links to /trip", async () => {
    render(<TripSegmentPage />)

    await waitFor(() => {
      expect(screen.getByTestId("breadcrumb-nav")).toBeInTheDocument()
    })

    const homeLinks = screen.getAllByRole("link", { name: "תוכנית הטיול" })
    expect(homeLinks[0]).toHaveAttribute("href", "/trip")
  })

  test("current segment name renders as non-linked BreadcrumbPage", async () => {
    render(<TripSegmentPage />)

    const nav = await waitFor(() => screen.getByRole("navigation", { name: "breadcrumb" }))

    const page = within(nav).getByText("בוקר")
    expect(page).toHaveAttribute("aria-current", "page")
    expect(page.tagName).not.toBe("A")
  })
})

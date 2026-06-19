/**
 * Integration test: day page (TripView → Day → Activity middle level)
 *
 * Mocks Firestore and hooks so we can mount the page and verify the breadcrumb
 * and the activity links that lead into the per-activity detail pages.
 */
import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import { formatTripDate } from "@/lib/trip"

// ── Module mocks ─────────────────────────────────────────────────────────────

jest.mock("next/navigation", () => ({
  useParams: () => ({ date: "2024-03-20" }),
  useRouter: () => ({ replace: jest.fn() }),
  notFound: jest.fn(),
}))

jest.mock("@/hooks/use-trip-id", () => ({
  useTripId: () => ({ tripId: "373", loading: false }),
}))

const mockDay = {
  date: "2024-03-20",
  segments: [
    {
      id: "2024-03-20-1",
      tripId: "373",
      date: "2024-03-20",
      timeSegment: "בוקר",
      timeSegmentNumeric: 1,
      summary: "ביקור במקדש",
      detailedContent: "<p>פרטים</p>",
      city: "Tokyo",
      hotelsDetails: "Shinjuku Hotel",
    },
    {
      id: "2024-03-20-2",
      tripId: "373",
      date: "2024-03-20",
      timeSegment: "צהריים",
      timeSegmentNumeric: 2,
      summary: "ארוחת צהריים",
      detailedContent: "<p>פרטים</p>",
      city: "Tokyo",
      hotelsDetails: "Shinjuku Hotel",
    },
  ],
}

jest.mock("@/lib/database", () => ({
  getTripDays: jest.fn().mockResolvedValue([mockDay]),
}))

// ── Test ──────────────────────────────────────────────────────────────────────

let TripDayPage: React.ComponentType

beforeAll(async () => {
  const mod = await import("../[date]/page")
  TripDayPage = mod.default
})

describe("TripDayPage", () => {
  test("home breadcrumb links to /trip#<date> so the plan highlights this day on return", async () => {
    render(<TripDayPage />)

    await waitFor(() => {
      expect(screen.getByTestId("breadcrumb-nav")).toBeInTheDocument()
    })

    const homeLink = screen.getByRole("link", { name: "תוכנית הטיול" })
    expect(homeLink).toHaveAttribute("href", "/trip#2024-03-20")
  })

  test("current day renders as a non-linked BreadcrumbPage", async () => {
    render(<TripDayPage />)

    const nav = await waitFor(() => screen.getByRole("navigation", { name: "breadcrumb" }))

    const page = within(nav).getByText(formatTripDate("2024-03-20"))
    expect(page).toHaveAttribute("aria-current", "page")
    expect(page.tagName).not.toBe("A")
  })

  test("lists the day's activities, each linking to its detail page", async () => {
    render(<TripDayPage />)

    await waitFor(() => {
      expect(screen.getByText("בוקר")).toBeInTheDocument()
    })

    const first = screen.getByRole("link", { name: /בוקר/ })
    expect(first).toHaveAttribute("href", "/trip/2024-03-20/1")

    const second = screen.getByRole("link", { name: /צהריים/ })
    expect(second).toHaveAttribute("href", "/trip/2024-03-20/2")
  })
})

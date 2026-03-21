"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

interface SurveyResponse {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  rating: "like" | "dislike";
  feedback: string | null;
  createdAt: string;
}

// Helper function to format date in Malaysia timezone (UTC+8)
const formatMalaysiaDateTime = (dateString: string) => {
  const date = new Date(dateString);
  // Subtract 8 hours to correct database offset
  const correctedDate = new Date(date.getTime() - 8 * 60 * 60 * 1000);

  const day = correctedDate.getDate().toString().padStart(2, "0");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[correctedDate.getMonth()];
  const year = correctedDate.getFullYear();

  let hours = correctedDate.getHours();
  const minutes = correctedDate.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const hoursStr = hours.toString().padStart(2, "0");

  return `${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`;
};

export default function SurveyRecordsPage() {
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<"all" | "like" | "dislike">(
    "all",
  );
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSurveys = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/survey");
      if (!response.ok) {
        throw new Error("Failed to fetch surveys");
      }
      const data = await response.json();
      setSurveys(data);
    } catch (err) {
      setError("Failed to load survey records");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [ratingFilter]);

  const likeCount = surveys.filter((s) => s.rating === "like").length;
  const dislikeCount = surveys.filter((s) => s.rating === "dislike").length;

  // Filter surveys based on selected rating
  const filteredSurveys = surveys.filter((s) => {
    if (ratingFilter === "all") return true;
    return s.rating === ratingFilter;
  });

  // Pagination calculations
  const totalItems = filteredSurveys.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSurveys = filteredSurveys.slice(startIndex, endIndex);
  const startItem = totalItems === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(endIndex, totalItems);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Survey Records</h2>
          <p className="text-muted-foreground">View all survey responses</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSurveys}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-md font-bold">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{surveys.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-md font-bold">Total Likes</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{likeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-md font-bold">Total Dislikes</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {dislikeCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Survey Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Survey Responses</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={ratingFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setRatingFilter("all")}
              >
                All
              </Button>
              <Button
                variant={ratingFilter === "like" ? "default" : "outline"}
                size="sm"
                onClick={() => setRatingFilter("like")}
                className={
                  ratingFilter === "like"
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }
              >
                <ThumbsUp
                  className={`size-3 mr-1 ${ratingFilter === "like" ? "text-white" : "text-green-500"}`}
                />
                Like
              </Button>
              <Button
                variant={ratingFilter === "dislike" ? "default" : "outline"}
                size="sm"
                onClick={() => setRatingFilter("dislike")}
                className={
                  ratingFilter === "dislike"
                    ? "bg-red-600 hover:bg-red-700"
                    : ""
                }
              >
                <ThumbsDown
                  className={`size-3 mr-1 ${ratingFilter === "dislike" ? "text-white" : "text-red-500"}`}
                />
                Dislike
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              {error}
            </div>
          ) : filteredSurveys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {ratingFilter === "all"
                ? "No survey responses yet"
                : `No ${ratingFilter} responses`}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="max-w-[400px]">Feedback</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSurveys.map((survey) => (
                    <TableRow key={survey.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {survey.userName || "Guest"}
                          </span>
                          {survey.userEmail && (
                            <span className="text-xs text-muted-foreground">
                              {survey.userEmail}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {survey.rating === "like" ? (
                          <Badge
                            variant="outline"
                            className="border-green-500 text-green-500"
                          >
                            <ThumbsUp className="size-3 mr-1" />
                            Like
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-red-500 text-red-500"
                          >
                            <ThumbsDown className="size-3 mr-1" />
                            Dislike
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[400px]">
                        <span className="line-clamp-2">
                          {survey.feedback || (
                            <span className="text-muted-foreground italic">
                              No feedback provided
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatMalaysiaDateTime(survey.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {startItem}-{endItem} of {totalItems} • Page {currentPage}{" "}
                    of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

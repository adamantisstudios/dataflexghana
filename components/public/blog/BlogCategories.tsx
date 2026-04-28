import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tag } from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  description: string
  color: string
}

interface BlogCategoriesProps {
  categories: Category[]
  currentCategory?: string
}

export function BlogCategories({ categories, currentCategory }: BlogCategoriesProps) {
  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-lg border border-blue-200 sticky top-8">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Categories
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link
          href="/blogs"
          className={`block p-3 rounded-lg transition-colors ${
            !currentCategory ? "bg-blue-100 text-blue-800 font-medium" : "hover:bg-blue-50 text-blue-600"
          }`}
        >
          All Posts
        </Link>

        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/blogs/category/${category.slug}`}
            className={`block p-3 rounded-lg transition-colors ${
              currentCategory === category.slug
                ? "bg-blue-100 text-blue-800 font-medium"
                : "hover:bg-blue-50 text-blue-600"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                <span className="text-sm md:text-base">{category.name}</span>
              </div>
            </div>
            {category.description && (
              <p className="text-xs md:text-sm text-gray-500 mt-1 line-clamp-2">{category.description}</p>
            )}
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

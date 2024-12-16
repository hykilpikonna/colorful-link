package org.hydev

import java.io.File
import javax.imageio.ImageIO

fun main() {
    // Read image
    val image = ImageIO.read(File("slither-cat.png"))
    val grid = 41 to 41
    println("Image size: ${image.width}x${image.height}")

    // Compute the pixel size of each grid
    val pixelSize = image.width.toDouble() / (grid.first - 1) to image.height.toDouble() / (grid.second - 1)
    println("Pixel size: ${pixelSize.first}x${pixelSize.second}")

    // Function to parse and return lines adjacent to a grid cell
    fun checkLines(cell: Pair<Int, Int>): List<Pair<Pair<Int, Int>, Pair<Int, Int>>> {
        val (sxc, syc) = cell

        // Start and end pixel of the cell
        val (sxp, syp) = sxc * pixelSize.first to syc * pixelSize.second

        // Get the edges. The edges are the center between two points
        val edges = mapOf(
            (sxc to syc + 1) to (sxp.toInt() to (syp + pixelSize.second / 2).toInt()),
            (sxc + 1 to syc) to ((sxp + pixelSize.first / 2).toInt() to syp.toInt()),
        )

        // Return edges that are colored black (grayness < 16)
        return edges.filter { (_, p) ->
            val (rx, ry) = p
            if (rx >= image.width + 5 || ry >= image.height + 5) return@filter false
            val (x, y) = rx.coerceIn(0, image.width - 1) to ry.coerceIn(0, image.height - 1)
            val rgb = image.getRGB(x, y).toULong()
            val grayness: ULong = (rgb and 0xFFu) + ((rgb shr 8) and 0xFFu) + ((rgb shr 16) and 0xFFu)

            // Debug : Draw a red point on the image
            if (grayness < 16u)
                image.setRGB(x, y, 0xFFFF0000.toInt())

            grayness < 16u
        }.map { (p, _) -> p }.map { p -> cell to p }
    }

    // For each x and y, check the lines
    val lines = (0 until grid.first).flatMap { x ->
        (0 until grid.second).map { y ->
            checkLines(x to y)
        }
    }.flatten()

    // Print the lines
    lines.forEach { (p1, p2) -> println("[${p1.first}, ${p1.second}, ${p2.first}, ${p2.second}],") }

    // Debug: Save the image
    ImageIO.write(image, "png", File("slither-cat-out.png"))
}
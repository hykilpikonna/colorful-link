package org.hydev

import java.io.File
import javax.imageio.ImageIO

fun main() {
    // Read image
    val image = ImageIO.read(File("slither-cat.png"))
    val grid = 40 to 40
    println("Image size: ${image.width}x${image.height}")

    // Compute the pixel size of each grid
    val pixelSize = image.width / grid.first to image.height / grid.second
    println("Pixel size: ${pixelSize.first}x${pixelSize.second}")

    fun center(p1: Pair<Int, Int>, p2: Pair<Int, Int>) = Pair((p1.first + p2.first) / 2, (p1.second + p2.second) / 2)

    // Function to parse and return lines adjacent to a grid cell
    fun checkLines(cell: Pair<Int, Int>): List<Pair<Pair<Int, Int>, Pair<Int, Int>>> {
        val (sxc, syc) = cell
        val (exc, eyc) = sxc + 1 to syc + 1

        // Start and end pixel of the cell
        val (sxp, syp) = sxc * pixelSize.first to syc * pixelSize.second
        val (exp, eyp) = exc * pixelSize.first to eyc * pixelSize.second

        // Get the edges. The edges are the center between two points
        val edges = mapOf(
            (sxc to syc) to center(sxp to syp, exp to syp),
            (exc to syc) to center(exp to syp, exp to eyp),
            (sxc to eyc) to center(sxp to eyp, exp to eyp),
            (exc to eyc) to center(sxp to eyp, exp to eyp),
        )

        // Return edges that are colored black (grayness < 16)
        return edges.filter { (_, p) ->
            val (x, y) = p
            val rgb = image.getRGB(x, y).toUInt().toULong()
            val grayness: ULong = (rgb and 0xFFu) + ((rgb shr 8) and 0xFFu) + ((rgb shr 16) and 0xFFu)
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
    lines.forEach { (p1, p2) -> println("{a: [${p1.first}, ${p1.second}], b: [${p2.first}, ${p2.second}]},") }
}
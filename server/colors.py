import numpy as np
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from PIL import Image
import matplotlib.pyplot as plt
import json


def generate_hv_colors(cluster_labels, sorted_indices):
    """
    Generate hColors and vColors from the clustered image.

    Parameters:
        cluster_labels (ndarray): The label of each pixel in the image corresponding to its color cluster.
        sorted_indices (ndarray): The index mapping of the sorted cluster centers.

    Returns:
        hColors (ndarray): (n+1) x (n+1) array with the color indices of horizontal lines.
        vColors (ndarray): (n+1) x (n+1) array with the color indices of vertical lines.
    """
    h, w = cluster_labels.shape
    hColors = np.zeros((h + 1, w + 1), dtype=np.uint8)
    vColors = np.zeros((h + 1, w + 1), dtype=np.uint8)

    # Fill hColors and vColors
    for y in range(h):
        for x in range(w):
            color_idx = cluster_labels[y, x]
            color_idx = np.where(sorted_indices == color_idx)[0][0]
            hColors[y, x] = color_idx
            # if x >= w - 1:
            #     hColors[y, x + 1] = color_idx

            vColors[y, x] = color_idx
            # if y >= h - 1:
            #     vColors[y + 1, x] = color_idx

    # Handle the bottom-right corner
    # hColors[h, w] = cluster_labels[h - 1, w - 1]
    # vColors[h, w] = cluster_labels[h - 1, w - 1]

    return hColors, vColors


def convert_colors_to_hex(cluster_centers):
    """
    Convert RGB colors to hex color strings.

    Parameters:
        cluster_centers (ndarray): The array of RGB colors (k, 3).

    Returns:
        list: List of hex color strings.
    """
    return [f"#{r:02x}{g:02x}{b:02x}" for r, g, b in cluster_centers]


if __name__ == '__main__':
    # Load image and convert to RGB
    image_path = r"C:\Users\Azalea\Downloads\Untitled_Artwork.png"
    image = Image.open(image_path).convert('RGB')
    image_array = np.array(image)

    # Reshape the image to a 2D array (num_pixels, 3)
    height, width, _ = image_array.shape
    pixels = image_array.reshape((-1, 3))

    # Cluster the pixels using KMeans
    n_colors = 32
    kmeans = KMeans(n_clusters=n_colors, random_state=42)
    kmeans.fit(pixels)

    # Get the mean color of each cluster (centroids)
    cluster_centers = kmeans.cluster_centers_.astype(int)

    # Replace each pixel with the closest cluster center
    labels = kmeans.labels_.reshape(height, width)
    new_image_array = cluster_centers[labels].reshape(image_array.shape)

    # Use PCA to sort the colors
    pca = PCA(n_components=1)
    color_positions = pca.fit_transform(cluster_centers)
    sorted_indices = np.argsort(color_positions[:, 0])
    sorted_cluster_centers = cluster_centers[sorted_indices]

    # Create a color palette from the sorted cluster centers
    palette_height = 20 * n_colors  # Each color swatch height
    palette_width = 100  # Width of each color swatch
    palette = np.zeros((palette_height, palette_width, 3), dtype=np.uint8)

    for i, color in enumerate(sorted_cluster_centers):
        start_y = i * 20
        end_y = (i + 1) * 20
        palette[start_y:end_y, :] = color

    # Display the original, reduced color image, and palette
    fig, axes = plt.subplots(1, 3, figsize=(15, 6))

    axes[0].set_title('Original Image')
    axes[0].imshow(image)
    axes[0].axis('off')

    axes[1].set_title(f'Image with {n_colors} Colors')
    axes[1].imshow(new_image_array)
    axes[1].axis('off')

    axes[2].set_title('Sorted Color Palette (PCA)')
    axes[2].imshow(palette)
    axes[2].axis('off')

    plt.tight_layout()
    plt.show()

    # Generate hColors and vColors
    hColors, vColors = generate_hv_colors(labels, sorted_indices)

    # Prepare output JSON structure
    output_data = {
        "hColors": {"__typedArray__": True, "type": "Int8Array",
                    "data": hColors.flatten().tolist()},
        "vColors": {"__typedArray__": True, "type": "Int8Array",
                    "data": vColors.flatten().tolist()},
        "colors": convert_colors_to_hex(sorted_cluster_centers)
    }

    # Save to JSON file
    output_path = r"C:\Users\Azalea\Downloads\output.json"
    with open(output_path, 'w') as f:
        json.dump(output_data, f)

    print(f"Saved output to {output_path}")

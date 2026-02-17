import os
import io
import base64
from django.conf import settings
import matplotlib.pyplot as plt


def save_plot(plot_img_path):
    """
    Save plot and return result.
    On Vercel (serverless), returns a base64 data URI since the filesystem is read-only.
    Locally, saves to MEDIA_ROOT and returns the media URL.
    """
    is_serverless = os.environ.get('VERCEL', False)

    if is_serverless:
        # Return base64-encoded image for serverless environments
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight')
        plt.close()
        buffer.seek(0)
        img_base64 = base64.b64encode(buffer.read()).decode('utf-8')
        return f"data:image/png;base64,{img_base64}"
    else:
        # Save to filesystem for local development
        image_path = os.path.join(settings.MEDIA_ROOT, plot_img_path)
        os.makedirs(os.path.dirname(image_path), exist_ok=True)
        plt.savefig(image_path)
        plt.close()
        image_url = settings.MEDIA_URL + plot_img_path
        return image_url
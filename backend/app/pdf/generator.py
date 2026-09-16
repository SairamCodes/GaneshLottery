import os
import uuid

from jinja2 import Environment, FileSystemLoader

# Load template environment
current_dir = os.path.dirname(os.path.abspath(__file__))
template_path = os.getenv("TICKET_TEMPLATE_PATH")
if template_path and os.path.isabs(template_path):
    pass
elif template_path:
    # If it starts with ./backend, strip it out since we run from backend
    if template_path.startswith("./backend/"):
        template_path = template_path.replace("./backend/", "./", 1)
    template_path = os.path.abspath(os.path.join(os.getcwd(), template_path))
else:
    template_path = os.path.join(current_dir, "template.html")
    
if not os.path.exists(template_path):
    template_path = os.path.join(current_dir, "template.html")

template_dir = os.path.dirname(template_path)
template_file = os.path.basename(template_path)

env = Environment(loader=FileSystemLoader(template_dir))

def generate_ticket_pdf(tickets_data, output_path: str):
    """
    tickets_data: list of dicts with keys:
    name, village, token_number, order_id, date, verify_url
    Generates a single PDF containing all tickets (one per page ideally, depending on CSS).
    """
    template = env.get_template(template_file)
    html_out = template.render(tickets=tickets_data)
    
    # Generate PDF using xhtml2pdf
    from xhtml2pdf import pisa
    
    with open(output_path, "wb") as pdf_file:
        pisa_status = pisa.CreatePDF(
            html_out, 
            dest=pdf_file,
            link_callback=lambda uri, rel: os.path.join(template_dir, uri)
        )
        
    if pisa_status.err:
        raise Exception(f"PDF generation failed: {pisa_status.err}")
        
    return output_path

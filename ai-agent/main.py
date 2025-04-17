import os
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate, HumanMessagePromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from db_loader import HydroponicDBLoader

# Load environment variables
load_dotenv()

# Initialize components
loader = HydroponicDBLoader()
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0.7,
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

def get_context():
    """Get context from database"""
    # Load data dari database
    docs = loader.load_data()
    # Get latest summary
    summary = loader.get_latest_summary()
    return docs, summary

def analyze_hydroponic_data(question: str, image_url: str = None):
    """Analyze hydroponic data with context"""
    # Get context
    docs, summary = get_context()
    
    # Log data from database
    print("\nData from Database:")
    print(f"Summary: {summary}")
    print("\nHistorical Data:")
    for doc in docs[:5]:
        print(doc.page_content)
    
    # Build context string
    context = f"""
    Ringkasan Data Hidroponik Terkini:
    {summary}
    
    Detail Data Terakhir:
    """
    for doc in docs[:3]:  # Ambil 3 data terakhir saja
        context += doc.page_content
        
    print("\nFormatted Context:")
    print(context)
    
    # Create prompt template
    template = """Kamu adalah asisten untuk sistem hidroponik yang menganalisis data sensor dari database MySQL.

Data Terakhir dari Database MySQL:
{context}

PENTING: 
1. Gunakan HANYA data sensor di atas untuk menganalisis kondisi tanaman
2. Berikan analisis yang spesifik berdasarkan nilai-nilai sensor:
   - Suhu (ideal: 18-28°C)
   - Kelembaban (ideal: 40-70%)
   - pH (ideal: 5.5-6.5)
   - Nutrisi PPM (sesuaikan dengan fase pertumbuhan)
3. Identifikasi tren atau pola dari data historis
4. Berikan rekomendasi spesifik jika ada nilai di luar kisaran ideal
5. Format respon menggunakan Markdown:
   - Gunakan *bold* untuk angka penting dan kesimpulan
   - Gunakan _italic_ untuk rekomendasi
   - Gunakan • untuk bullet points
   - Gunakan ### untuk sub-judul
   - Tambahkan emoji yang relevan (🌡️ untuk suhu, 💧 untuk kelembaban, 🧪 untuk pH, 🌿 untuk nutrisi)

Pertanyaan: {question}
"""
    if image_url:
        template += "\nGambar Tanaman: {image_url}"
    
    human_message = HumanMessagePromptTemplate.from_template(template)
    chat_prompt = ChatPromptTemplate.from_messages([human_message])
    
    # Create chat completion
    messages = chat_prompt.format_messages(
        context=context,
        question=question,
        image_url=image_url if image_url else ""
    )
    
    # Get response from model
    response = llm.invoke(messages)
    print("\nModel Response:")
    return response.content

if __name__ == "__main__":
    # Example usage
    question = "Bagaimana kondisi tanaman hidroponik saat ini berdasarkan data sensor?"
    result = analyze_hydroponic_data(question)
    print(result)

# Prueba de funcionalidad e instalacion Kivy

'''
PRIMER PRUEBA DE EJECUCION

from kivy.app import App
from kivy.uix.label import Label

class BasicApp(App):
    def build (self):
        label=Label(text="Hola Mundo")
        return label

app= BasicApp()
app.run()

'''
#Segunda Prueba de Ejecucion

from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.config import Config

# Ajustar el tamaño de la ventana para emular un teléfono inteligente en una pantalla de computadora
Config.set('graphics', 'width', '225')  # Anchura más estrecha
Config.set('graphics', 'height', '400')  # Altura más alta

class MyApp(App):
    def build(self):
        layout = BoxLayout(orientation='vertical', padding=20, spacing=10)
        
        label = Label(text='Hola Mundo', size_hint=(1, 0.3))
        button = Button(text='Presioname', size_hint=(1, 0.15))
        
        layout.add_widget(label)
        layout.add_widget(button)
        
        return layout

if __name__ == "__main__":
    MyApp().run()


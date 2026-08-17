Are you a multistreamer who’s always asking your viewers for their opinion about stuff? Sure, most platforms have their own poll system, but wouldn’t it be way better if you had **one global poll** that works across all the platforms you stream to?

Introducing **rexbordz’s MultiPoll Widget**.

It’s a clean browser-source widget that lets you run polls right on your stream, pulling votes straight from **Twitch**, **YouTube**, **Kick**, and **TikTok** chat. You can set up 2–5 choices, and your viewers just vote by typing the number of their choice (1, 2, 3, 4, or 5). Simple and universal.

Starting a poll is super easy. I built a very intuitive dock page where you can configure everything. This dock also shows a live data of the poll if there's an active one going on. Isn't that cool?!

<img width="809" height="313" alt="Multipoll sample image" src="https://github.com/user-attachments/assets/3f1e8417-f46d-46b4-af75-4a85c361ad02" />

---

## **🔌 Requirements**

<img src="https://github.com/user-attachments/assets/77ff6913-e6d7-4fe0-b9a0-bf66f5e8f745" style="height: 1em; vertical-align: middle;"> **Streamer.Bot (For Twitch, YouTube, and/or Kick)** <br>
If you need help setting this up, visit their [website](https://streamer.bot/).

<img src="https://github.com/user-attachments/assets/3ec8eac2-17d2-4a97-a066-e55c1e29d2c5" style="height: 1em; vertical-align: middle;"> **Tikfinity (For TikTok)** <br>
You need this to be able to listen to TikTok events. If you need help setting this up, you can check out my [Tikfinity Setup Guide](https://www.notion.so/Tikfinity-Setup-Guide-241088f4f93e8051b991c6ef4b659934?pvs=21).

---

## **🚀 Installation**

1. **Open Streamer.bot (For Twitch, YouTube or Kick)**
    - You need to have WebSocket Server enabled:
        
        <img width="998" height="693" alt="image" src="https://github.com/user-attachments/assets/e7635495-9b25-4276-8be1-154402a82298" />

        
2. **Open TikFinity (For TikTok)**
    -  TikFinity’s WebSocket Server is on by default so there’s nothing else that needs to be done
3. **Import Streamer.bot Actions**
    - [Copy the import code from here](https://github.com/rexbordz/multi-poll-widget/blob/main/import.sb)
    - Click `Import` and paste the code into the textbox

      <img width="913" height="618" alt="image" src="https://github.com/user-attachments/assets/a8008849-b776-416b-a945-32d25b36f09c" />

    - Click `Import` and then just click `Yes` to all the prompts especially the last one

      <img width="758" height="737" alt="image" src="https://github.com/user-attachments/assets/f1c7232c-dd73-4059-968b-a1f216f245cd" />

4. **Configure your overlay settings**
    - Open the [settings page](https://rexbordz.github.io/multi-poll-widget/settings) in a new tab
    - Configure the settings to your heart's desire then click `Copy Link URL`
      <img width="2518" height="1314" alt="image" src="https://github.com/user-attachments/assets/a4868567-23d4-48c3-8628-f722569b2982" />

5. Add a `Browser Source` and paste the link in the `URL` field to your streaming software of choice.    
    <img width="1201" height="974" alt="image" src="https://github.com/user-attachments/assets/f58e8a21-b4a5-4106-80cd-a61b0e2b2406" />
  
  > [!TIP]
  > Make sure to set the height so that there's enough space for the poll with 5 choices at most. The width is stretchable so you can set it to whatever.

6. Add the **MultiPoll Widget Controller** as a **Custom Browser Dock** to your streaming software of choice. 
    
    ```xml
    https://rexbordz.github.io/multi-poll-widget/dashboard
    ```
    <img width="1052" height="623" alt="image" src="https://github.com/user-attachments/assets/bac659a5-fe9e-4db1-ab3f-0e555ca8bf3d" />
        
7. Start a poll using the Controller page. First two choices are required. When you’re ready, just click **`Start Poll`**.
    <p align="center">
      <img width="469" height="625" alt="image" src="https://github.com/user-attachments/assets/a7b557b1-6204-43cd-8bc0-d402d4ccdfcf" />
    </p>
   <img width="809" height="313" alt="image" src="https://github.com/user-attachments/assets/a1b73a02-39c1-463a-8647-7b8e1ed60ced" />
    
  > [!TIP]
  > ✅ **SUCCESS!** You have successfully installed Multipoll.

---
## Stream Deck

The actions are also compatible with Stream Deck. Just download the pre-made stream deck profiles I made [here](https://github.com/rexbordz/multi-poll-widget/tree/main/streamdeck), and import the correct variant to your Stream Deck Software. Through the Streamer.bot integration, some of the buttons are responsive and know the state of your current poll.

<img width="637" height="495" alt="image" src="https://github.com/user-attachments/assets/b64e2def-15d4-4ae4-83ce-2b00739b1ece" />
<img width="627" height="442" alt="image" src="https://github.com/user-attachments/assets/4084dd0d-c0fb-4209-9330-f125f00c6785" />

---
## For the Nerds
> [!TIP]
> When you right click a **MultiPoll Widget • Poll Started** trigger and click **Requeue**, it will run that poll again with the same poll configuration.

<img width="1186" height="767" alt="image" src="https://github.com/user-attachments/assets/ab9d53e0-b881-4147-969a-27dabad054b7" />

> [!TIP]
> You can also get the import code and the download link for the stream deck profiles through this button. It will also show you the status of all the Streamer.bot actions associated with the poll. A yellow dot at the bottom right suggests that you're missing at least one action

<p align="center">
<img width="643" height="601" alt="image" src="https://github.com/user-attachments/assets/c86e5a99-e98d-4544-a32a-e38c4abee242" />
    
<img width="485" height="573" alt="image" src="https://github.com/user-attachments/assets/8e4a0c58-0abc-4beb-b36e-fd5e8eedb54a" />
</p>

## 💝 Donate

Your donations help me create better content and improve stream quality! If you'd like to support my work and see more of it, you can donate through the following:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/M4M3C7R1J)

---

## 📞 Support

For technical support or inquiries, please contact me through my Discord channel:

- <img src="https://github.com/user-attachments/assets/99e66009-11f1-4bcc-a06f-aa5c2f90524a" style="height: 1.5em;"> **[Discord Server](https://discord.gg/cgufFBJKY7)**
